
import React, { useState, useRef, useEffect } from 'react';
import { Download, Save, RotateCcw } from 'lucide-react';
import { CanvasState, Layer, TextLayer, ShapeLayer, ImageLayer } from '../types';

interface CanvasProps {
  state: CanvasState;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onSelect: (id: string) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onExport: () => void;
  onSaveTemplate: () => void;
  onReset: () => void;
}

type DragMode = 'move' | 'resize';
type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';

interface GuideLine {
  type: 'horizontal' | 'vertical';
  position: number; // Percentage
}

export const Canvas: React.FC<CanvasProps> = ({ state, onLayerUpdate, onSelect, canvasRef, onExport, onSaveTemplate, onReset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [dragState, setDragState] = useState<{
    mode: DragMode;
    layerId: string;
    handle?: HandleType;
    startX: number;
    startY: number;
    startLayer: Layer; 
  } | null>(null);

  // 计算缩放比例，使画布完整显示在视图中
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
        const padding = 64; // p-8 * 2
        const availableW = containerW - padding;
        const availableH = containerH - padding;
        
        // 避免除以0
        if (state.width === 0 || state.height === 0) return;

        const scaleW = availableW / state.width;
        const scaleH = availableH / state.height;
        
        // 取较小值以确保完全可见，并留出一点边距
        const newScale = Math.min(scaleW, scaleH) * 0.95;
        // 确保 scale 有效
        setScale(Number.isFinite(newScale) ? newScale : 1);
      }
    };

    // 初始计算
    handleResize();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 使用 ResizeObserver 监听容器大小变化
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [state.width, state.height]);

  const getClientPos = (e: React.MouseEvent) => ({ x: e.clientX, y: e.clientY });

  const handleMouseDown = (e: React.MouseEvent, layer: Layer, mode: DragMode, handle?: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(layer.id);
    
    setDragState({
      mode,
      layerId: layer.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startLayer: { ...layer } 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !canvasRef.current) return;
    
    const { mode, handle, startX, startY, startLayer, layerId } = dragState;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentPos = getClientPos(e);
    
    const deltaX = currentPos.x - startX;
    const deltaY = currentPos.y - startY;
    
    const deltaPctX = (deltaX / canvasRect.width) * 100;
    const deltaPctY = (deltaY / canvasRect.height) * 100;

    if (mode === 'move') {
      let newX = startLayer.x + deltaPctX;
      let newY = startLayer.y + deltaPctY;

      // --- 吸附逻辑 Start ---
      const SNAP_THRESHOLD_PX = 5; // 5像素吸附阈值
      const thresholdX = (SNAP_THRESHOLD_PX / canvasRect.width) * 100;
      const thresholdY = (SNAP_THRESHOLD_PX / canvasRect.height) * 100;

      const activeGuides: GuideLine[] = [];

      // 1. 定义当前图层的关键点 (百分比)
      const currentHalfW = startLayer.width / 2;
      const currentHalfH = startLayer.height / 2;

      // 2. 定义吸附目标 (画布中心 + 其他图层边缘/中心)
      // 垂直线 (X轴位置)
      const vTargets = [
        { val: 50, type: 'canvas-center' }, // 画布中线
        { val: 0, type: 'canvas-edge' },
        { val: 100, type: 'canvas-edge' }
      ];
      // 水平线 (Y轴位置)
      const hTargets = [
        { val: 50, type: 'canvas-center' },
        { val: 0, type: 'canvas-edge' },
        { val: 100, type: 'canvas-edge' }
      ];

      // 加入其他图层作为吸附目标
      state.layers.forEach(l => {
        if (l.id === layerId) return; // 跳过自己
        const lHalfW = l.width / 2;
        const lHalfH = l.height / 2;
        vTargets.push({ val: l.x, type: 'layer-center' });
        vTargets.push({ val: l.x - lHalfW, type: 'layer-edge' });
        vTargets.push({ val: l.x + lHalfW, type: 'layer-edge' });
        
        hTargets.push({ val: l.y, type: 'layer-center' });
        hTargets.push({ val: l.y - lHalfH, type: 'layer-edge' });
        hTargets.push({ val: l.y + lHalfH, type: 'layer-edge' });
      });

      // 3. 检查 X 轴吸附
      // 检查：左边、中间、右边
      let snappedX = false;
      let bestDiffX = Infinity;
      let targetXVal = 0;
      let offsetToApplyX = 0; // 需要应用到 newX 的修正值

      // 辅助函数：尝试吸附
      const checkXSnap = (currentVal: number, offsetFromCenter: number) => {
        for (const target of vTargets) {
          const diff = Math.abs(currentVal - target.val);
          if (diff < thresholdX && diff < bestDiffX) {
            bestDiffX = diff;
            targetXVal = target.val;
            // 如果 currentVal 是左边(x - w/2)，要让它变成 target.val，那么新的中心 x 应该是 target.val + w/2
            // 所以 newX = target.val - offsetFromCenter
            offsetToApplyX = offsetFromCenter; 
            snappedX = true;
          }
        }
      };

      checkXSnap(newX, 0); // 中间
      checkXSnap(newX - currentHalfW, -currentHalfW); // 左边
      checkXSnap(newX + currentHalfW, currentHalfW); // 右边

      if (snappedX) {
        newX = targetXVal - offsetToApplyX;
        activeGuides.push({ type: 'vertical', position: targetXVal });
      }

      // 4. 检查 Y 轴吸附
      let snappedY = false;
      let bestDiffY = Infinity;
      let targetYVal = 0;
      let offsetToApplyY = 0;

      const checkYSnap = (currentVal: number, offsetFromCenter: number) => {
        for (const target of hTargets) {
          const diff = Math.abs(currentVal - target.val);
          if (diff < thresholdY && diff < bestDiffY) {
            bestDiffY = diff;
            targetYVal = target.val;
            offsetToApplyY = offsetFromCenter;
            snappedY = true;
          }
        }
      };

      checkYSnap(newY, 0); // 中间
      checkYSnap(newY - currentHalfH, -currentHalfH); // 顶部
      checkYSnap(newY + currentHalfH, currentHalfH); // 底部

      if (snappedY) {
        newY = targetYVal - offsetToApplyY;
        activeGuides.push({ type: 'horizontal', position: targetYVal });
      }
      
      setGuides(activeGuides);
      // --- 吸附逻辑 End ---

      onLayerUpdate(layerId, {
        x: newX,
        y: newY
      });
    } else if (mode === 'resize' && handle) {
      setGuides([]); // Resize 时暂时不显示辅助线（为了简化交互，避免过度闪烁）
      let newWidth = startLayer.width;
      let newHeight = startLayer.height;
      let newX = startLayer.x;
      let newY = startLayer.y;
      
      const isWest = handle.includes('w');
      const isEast = handle.includes('e');
      const isNorth = handle.includes('n');
      const isSouth = handle.includes('s');
      
      if (isEast) {
         newWidth += deltaPctX;
         newX += deltaPctX / 2;
      }
      if (isWest) {
         newWidth -= deltaPctX;
         newX += deltaPctX / 2;
      }
      if (isSouth) {
         newHeight += deltaPctY;
         newY += deltaPctY / 2;
      }
      if (isNorth) {
         newHeight -= deltaPctY;
         newY += deltaPctY / 2;
      }
      
      if (newWidth < 1) newWidth = 1;
      if (newHeight < 1) newHeight = 1;

      onLayerUpdate(layerId, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setGuides([]); // 清除辅助线
  };

  const renderSelectionOverlay = (layer: Layer) => {
    // 反向缩放，保持控制柄视觉大小一致
    const inverseScale = 1 / scale;
    const handleSize = 10; // px
    const borderWidth = 2 * inverseScale;
    
    const handleStyle = (pos: React.CSSProperties, cursor: string) => (
      <div
        className="absolute bg-white border border-orange-500 rounded-full z-50 pointer-events-auto shadow-sm flex items-center justify-center"
        style={{ 
            ...pos, 
            width: handleSize * inverseScale,
            height: handleSize * inverseScale,
            borderWidth: 1 * inverseScale,
            transform: `translate(-50%, -50%)`,
            cursor 
        }}
        onMouseDown={(e) => handleMouseDown(e, layer, 'resize', cursor.replace('-resize', '') as HandleType)}
      />
    );

    return (
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
             border: `${borderWidth}px solid #f97316`,
             left: -borderWidth, 
             top: -borderWidth, 
             right: -borderWidth, 
             bottom: -borderWidth
        }}
      >
        {/* Corners */}
        {handleStyle({ left: '0%', top: '0%' }, 'nw-resize')}
        {handleStyle({ left: '100%', top: '0%' }, 'ne-resize')}
        {handleStyle({ left: '0%', top: '100%' }, 'sw-resize')}
        {handleStyle({ left: '100%', top: '100%' }, 'se-resize')}
        
        {/* Sides */}
        {handleStyle({ left: '50%', top: '0%' }, 'n-resize')}
        {handleStyle({ left: '50%', top: '100%' }, 's-resize')}
        {handleStyle({ left: '0%', top: '50%' }, 'w-resize')}
        {handleStyle({ left: '100%', top: '50%' }, 'e-resize')}
      </div>
    );
  };

  const renderLayer = (layer: Layer) => {
    const isSelected = state.selectedId === layer.id;
    // 使用 calc 来定位，替代 translate(-50%, -50%)，以提高 html2canvas 导出的兼容性
    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      left: `calc(${layer.x}% - ${layer.width / 2}%)`,
      top: `calc(${layer.y}% - ${layer.height / 2}%)`,
      width: `${layer.width}%`,
      height: `${layer.height}%`,
      transform: `rotate(${layer.rotation}deg)`,
      transformOrigin: 'center center',
      opacity: layer.opacity / 100,
      zIndex: layer.zIndex,
      cursor: dragState?.mode === 'resize' ? 'default' : 'move',
      userSelect: 'none'
    };

    let content = null;

    if (layer.type === 'shape') {
      const l = layer as ShapeLayer;
      content = (
        <div
          style={{
            width: '100%', height: '100%',
            backgroundColor: l.backgroundColor,
            border: `${l.borderWidth}px solid ${l.borderColor}`,
            borderRadius: `${l.borderRadius}px`,
            boxShadow: l.boxShadowEnabled ? `0 4px ${l.boxShadowBlur}px ${l.boxShadowColor}` : 'none',
            boxSizing: 'border-box', // 显式声明，辅助导出渲染
          }}
        />
      );
    } else if (layer.type === 'text') {
      const l = layer as TextLayer;
      content = (
        <div
          className={`flex w-full h-full items-center ${l.textAlign === 'center' ? 'justify-center' : l.textAlign === 'right' ? 'justify-end' : 'justify-start'}`}
          style={{
            whiteSpace: 'pre-wrap', 
            overflow: 'hidden',
          }}
        >
          <span style={{
            fontSize: `${l.fontSize}px`,
            fontFamily: l.fontFamily,
            fontWeight: l.fontWeight,
            color: l.color,
            lineHeight: l.lineHeight,
            letterSpacing: `${l.letterSpacing}px`,
            textAlign: l.textAlign,
            textShadow: l.textShadowEnabled ? `0 2px ${l.textShadowBlur}px ${l.textShadowColor}` : 'none',
            backgroundColor: l.backgroundColor,
            padding: `${l.padding}px`,
            borderRadius: `${l.borderRadius || 0}px`,
            // 确保文字也能随容器换行
            wordBreak: 'break-word',
            display: 'inline-block',
            width: '100%'
          }}>
            {l.text}
          </span>
        </div>
      );
    } else if (layer.type === 'image') {
      const l = layer as ImageLayer;
      content = (
        <img src={l.src} alt="layer" className="w-full h-full pointer-events-none" style={{ objectFit: l.objectFit }} />
      );
    }

    return (
      <div
        key={layer.id}
        onMouseDown={(e) => handleMouseDown(e, layer, 'move')}
        onClick={(e) => e.stopPropagation()}
        style={commonStyle}
        className="group"
      >
        {content}
        {isSelected && renderSelectionOverlay(layer)}
        {!isSelected && (
            <div className="absolute inset-0 border border-transparent group-hover:border-orange-200 pointer-events-none transition-colors" />
        )}
      </div>
    );
  };

  return (
    <main 
      ref={containerRef}
      className="flex-1 bg-slate-200 flex items-center justify-center relative overflow-hidden select-none p-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelect('')}
    >
      {/* 快速导出按钮 */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-50">
        <button 
          onClick={onExport}
          className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center group"
          title="快速导出封面"
        >
          <Download className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold ml-0 group-hover:ml-2">
              导出封面
          </span>
        </button>

        <button 
          onClick={onSaveTemplate}
          className="bg-white hover:bg-slate-50 text-slate-600 p-3 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center group"
          title="保存为模板"
        >
          <Save className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold ml-0 group-hover:ml-2">
              保存模板
          </span>
        </button>

        <button 
          onClick={onReset}
          className="bg-white hover:bg-slate-50 text-slate-600 p-3 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center group"
          title="重置画布"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold ml-0 group-hover:ml-2">
              重置画布
          </span>
        </button>
      </div>

      {/* 
         外层容器：负责缩放和阴影
         注意：transform-origin 设为 center，配合 flex 居中
      */}
      <div
         className="shadow-2xl checkerboard-bg transition-transform duration-200 ease-out"
         style={{
            width: `${state.width}px`,
            height: `${state.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            flexShrink: 0
         }}
      >
        {/* 
            内层容器（ref=canvasRef）：
            这是实际导出的部分，尺寸是真实的物理像素（如 1080x1920）
        */}
        <div 
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden"
            style={{
                backgroundColor: state.canvasBackgroundColor,
            }}
        >
            {/* 背景图层 */}
            {state.canvasBackgroundImage && (
                <div 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                        backgroundImage: `url(${state.canvasBackgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 0
                    }}
                />
            )}
            
            {/* 辅助线渲染 */}
            {guides.map((guide, index) => {
              // 计算视觉上固定的线条宽度 (例如 2px)
              // 随着画布缩小 (scale < 1)，thickness 变大，抵消缩放，使视觉宽度恒定
              const thickness = Math.max(1, 2 / scale);

              return (
                <div
                  key={`guide-${index}`}
                  className="absolute z-[9999] pointer-events-none"
                  style={{
                    backgroundColor: '#ff0055', // 更鲜艳的红粉色，提高对比度
                    // 添加白色描边发光效果，确保在深色背景上也能看清
                    boxShadow: `0 0 ${2 / scale}px rgba(255, 255, 255, 0.9)`,
                    ...(guide.type === 'vertical' ? {
                      left: `${guide.position}%`,
                      top: 0,
                      bottom: 0,
                      width: `${thickness}px`,
                      transform: 'translateX(-50%)'
                    } : {
                      top: `${guide.position}%`,
                      left: 0,
                      right: 0,
                      height: `${thickness}px`,
                      transform: 'translateY(-50%)'
                    })
                  }}
                />
              );
            })}

            {/* 普通图层 */}
            {state.layers.map((layer, index) => {
                const layerWithIndex = { ...layer, zIndex: 10 + index };
                return renderLayer(layerWithIndex);
            })}
        </div>
      </div>
      
      {/* 显示当前缩放比例，方便调试 */}
      <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-400 bg-white/80 px-2 py-1 rounded">
        {Math.round(scale * 100)}%
      </div>
    </main>
  );
};
