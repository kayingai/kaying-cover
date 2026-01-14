
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasState, Layer, LayerType, TextLayer, ShapeLayer, ImageLayer, Template } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { AlertTriangle } from 'lucide-react';

// 自定义确认对话框组件
const ConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ isOpen, title, message, onConfirm, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap mb-8 font-medium">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
            >
              取消
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all active:scale-95 text-sm"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 默认状态定义，用于重置和合并
  const DEFAULT_STATE: CanvasState = {
    canvasBackgroundColor: '#ffffff',
    canvasBackgroundImage: null,
    width: 1080,
    height: 1920,
    aspectRatioLabel: '9:16',
    layers: [],
    selectedId: null,
  };

  // 初始状态
  const [state, setState] = useState<CanvasState>(DEFAULT_STATE);

  // 模板列表状态
  const [templates, setTemplates] = useState<Template[]>([]);

  // 确认弹窗状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 从 LocalStorage 加载模板
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kaying_cover_templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load templates', e);
    }
  }, []);

  // 保存模板到 LocalStorage
  const saveTemplatesToStorage = (newTemplates: Template[]) => {
    try {
      localStorage.setItem('kaying_cover_templates', JSON.stringify(newTemplates));
    } catch (e) {
      console.error('Failed to save templates (likely quota exceeded)', e);
      alert('保存失败：可能是图片素材过大导致存储空间不足。请尝试减少图片数量或压缩图片。');
    }
  };

  const handleSaveTemplate = () => {
    const now = new Date();
    // 格式化时间为 YYYYMMDDHHmmss
    const timeStr = 
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const newTemplate: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: `template-${timeStr}`,
      createdAt: Date.now(),
      // 深拷贝当前状态，并清除选中项
      state: JSON.parse(JSON.stringify({
        ...state,
        selectedId: null
      }))
    };

    const updatedTemplates = [newTemplate, ...templates];
    setTemplates(updatedTemplates);
    saveTemplatesToStorage(updatedTemplates);
    alert(`模板 "${newTemplate.name}" 已保存！`);
  };

  const handleLoadTemplate = (template: Template) => {
    if (!template) return;

    setConfirmDialog({
      isOpen: true,
      title: '加载模板',
      message: `确认加载模板 "${template.name}" 吗？\n注意：这将清空当前画布，并基于模板内容重新创建。`,
      onConfirm: () => {
        try {
          const savedState = (template.state || {}) as any;
          
          // 健壮性处理：将保存的状态与默认状态合并
          const newState: CanvasState = {
            canvasBackgroundColor: savedState.canvasBackgroundColor || DEFAULT_STATE.canvasBackgroundColor,
            canvasBackgroundImage: savedState.canvasBackgroundImage || DEFAULT_STATE.canvasBackgroundImage,
            width: Number(savedState.width) || DEFAULT_STATE.width,
            height: Number(savedState.height) || DEFAULT_STATE.height,
            aspectRatioLabel: savedState.aspectRatioLabel || DEFAULT_STATE.aspectRatioLabel,
            // 确保 layers 是数组
            layers: Array.isArray(savedState.layers) ? JSON.parse(JSON.stringify(savedState.layers)) : [],
            selectedId: null, // 加载后重置选中状态
          };

          setState(newState);
        } catch (error) {
          console.error("Error loading template:", error);
          alert("加载模板数据时发生错误，请检查模板是否损坏。");
        }
      }
    });
  };

  const handleResetCanvas = () => {
    setConfirmDialog({
      isOpen: true,
      title: '重置画布',
      message: '确定要重置画布吗？\n所有未保存的更改都将丢失，画布将恢复到初始状态。',
      onConfirm: () => {
        setState({
          ...DEFAULT_STATE,
          layers: [] // 显式重置图层
        });
      }
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除模板',
      message: '确定要删除这个模板吗？此操作无法撤销。',
      onConfirm: () => {
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        saveTemplatesToStorage(updated);
      }
    });
  };

  const handleRenameTemplate = (id: string, newName: string) => {
    const updated = templates.map(t => t.id === id ? { ...t, name: newName } : t);
    setTemplates(updated);
    saveTemplatesToStorage(updated);
  };

  // 下载模板 (JSON)
  const handleDownloadTemplate = (template: Template) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${template.name || 'template'}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error("Failed to download template", e);
      alert("导出模板失败");
    }
  };

  // 导入模板 (JSON)
  const handleImportTemplate = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // 简单校验
        if (!parsed.state || !Array.isArray(parsed.state.layers)) {
          alert("无效的模板文件格式：缺少必要的图层数据。");
          return;
        }

        const newTemplate: Template = {
          ...parsed,
          id: Math.random().toString(36).substr(2, 9), // 重新生成 ID 防止冲突
          name: parsed.name ? `${parsed.name} (Imported)` : 'Imported Template',
          createdAt: Date.now()
        };

        const updatedTemplates = [newTemplate, ...templates];
        setTemplates(updatedTemplates);
        saveTemplatesToStorage(updatedTemplates);
        alert(`模板 "${newTemplate.name}" 导入成功！`);
      } catch (error) {
        console.error("Error parsing imported template:", error);
        alert("导入失败：文件损坏或格式不正确。");
      }
    };
    reader.readAsText(file);
  };

  // 导出图片功能
  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    // 取消选中状态，避免导出时包含编辑框
    setState(prev => ({ ...prev, selectedId: null }));

    // 等待 React 渲染清除选中框
    setTimeout(async () => {
      try {
        // 1. 创建临时容器
        // 使用 fixed 定位确保不被页面滚动影响，且不在视口内闪烁 (z-index 负值)
        const exportContainer = document.createElement('div');
        exportContainer.style.width = `${state.width}px`;
        exportContainer.style.height = `${state.height}px`;
        exportContainer.style.position = 'fixed';
        exportContainer.style.left = '0';
        exportContainer.style.top = '0';
        exportContainer.style.zIndex = '-9999';
        // 确保背景色正确，如果 state 是 transparent，则保持透明
        exportContainer.style.backgroundColor = state.canvasBackgroundColor === 'transparent' ? 'transparent' : state.canvasBackgroundColor;
        
        document.body.appendChild(exportContainer);

        // 2. 克隆画布内容
        if (!canvasRef.current) return;
        const clonedNode = canvasRef.current.cloneNode(true) as HTMLElement;
        
        // 3. 强制重置克隆节点的样式以适应导出容器
        // 关键：移除可能存在的 transform，确保 1:1 像素映射
        clonedNode.style.width = '100%';
        clonedNode.style.height = '100%';
        clonedNode.style.transform = 'none';
        clonedNode.style.margin = '0';
        clonedNode.style.borderRadius = '0';
        clonedNode.style.boxShadow = 'none';
        clonedNode.style.position = 'static';
        
        exportContainer.appendChild(clonedNode);

        // 4. 生成图片 (使用 2倍 缩放以获得更好的阴影和抗锯齿效果，然后缩放回原尺寸)
        // @ts-ignore - html2canvas is loaded via CDN
        const highResCanvas = await window.html2canvas(exportContainer, {
          backgroundColor: null,
          useCORS: true,
          scale: 2, // 使用 2x 采样
          width: state.width,
          height: state.height,
          windowWidth: state.width,
          windowHeight: state.height,
          logging: false,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc: Document) => {
             // 可以在这里对克隆的 DOM 进行额外处理
             const elements = doc.querySelectorAll('*');
             elements.forEach((el) => {
               if (el instanceof HTMLElement) {
                 el.style.boxSizing = 'border-box';
               }
             });
          }
        });

        // 5. 缩放回目标尺寸 (抗锯齿)
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = state.width;
        finalCanvas.height = state.height;
        const ctx = finalCanvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(highResCanvas, 0, 0, state.width, state.height);
        }

        // 6. 清理 DOM
        document.body.removeChild(exportContainer);

        // 7. 下载
        const link = document.createElement('a');
        link.download = `cover-${state.width}x${state.height}-${Date.now()}.png`;
        link.href = finalCanvas.toDataURL('image/png', 1.0); // High quality
        link.click();
      } catch (error) {
        console.error('Export failed:', error);
        alert('导出失败，请检查是否使用了跨域图片资源或稍后重试。');
      }
    }, 100);
  };

  // 添加图层通用方法
  const addLayer = useCallback((type: LayerType, extraData: any = {}) => {
    const newId = Math.random().toString(36).substr(2, 9);
    let newLayer: Layer;

    const baseProps = {
      id: newId,
      visible: true,
      zIndex: 0,
      opacity: 100,
      rotation: 0,
    };

    if (type === 'text') {
      newLayer = {
        ...baseProps,
        type: 'text',
        name: '文本图层',
        text: extraData.text || '双击编辑文本',
        x: 50, y: 50, width: 80, height: 15,
        fontSize: 120,
        color: '#ffffff',
        fontFamily: 'Noto Sans SC',
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.2,
        backgroundColor: 'transparent',
        padding: 0,
        borderRadius: 0,
        textShadowEnabled: true,
        textShadowBlur: 10,
        textShadowColor: 'rgba(0,0,0,0.5)',
      } as TextLayer;
    } else if (type === 'shape') {
      newLayer = {
        ...baseProps,
        type: 'shape',
        name: '形状图层',
        shapeType: 'rectangle',
        x: 50, y: 50, width: 60, height: 30,
        backgroundColor: '#f97316',
        borderColor: '#ffffff',
        borderWidth: 0,
        borderRadius: 40,
        boxShadowEnabled: true,
        boxShadowBlur: 40,
        boxShadowColor: 'rgba(0,0,0,0.3)',
      } as ShapeLayer;
    } else {
      newLayer = {
        ...baseProps,
        type: 'image',
        name: '图片图层',
        src: extraData.src || '',
        x: 50, y: 50, width: 50, height: 50,
        objectFit: 'contain',
      } as ImageLayer;
    }

    setState(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer], // 添加到顶层
      selectedId: newId
    }));
  }, []);

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, ...updates } as Layer : l)
    }));
  };

  const reorderLayer = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setState(prev => {
      const index = prev.layers.findIndex(l => l.id === id);
      if (index === -1) return prev;
      
      const newLayers = [...prev.layers];
      const [movedLayer] = newLayers.splice(index, 1);
      
      if (direction === 'up') {
        newLayers.splice(Math.min(index + 1, newLayers.length), 0, movedLayer);
      } else if (direction === 'down') {
        newLayers.splice(Math.max(index - 1, 0), 0, movedLayer);
      } else if (direction === 'top') {
        newLayers.push(movedLayer);
      } else if (direction === 'bottom') {
        newLayers.unshift(movedLayer);
      }
      
      return { ...prev, layers: newLayers };
    });
  };

  const deleteLayer = (id: string) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId
    }));
  };

  const selectedLayer = state.layers.find(l => l.id === state.selectedId) || null;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden">
      <Sidebar 
        state={state} 
        setState={setState} 
        addLayer={addLayer}
        reorderLayer={reorderLayer}
        deleteLayer={deleteLayer}
        onExport={handleExport}
        templates={templates}
        onLoadTemplate={handleLoadTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onRenameTemplate={handleRenameTemplate}
        onDownloadTemplate={handleDownloadTemplate}
        onImportTemplate={handleImportTemplate}
      />
      
      <Canvas 
        state={state} 
        onLayerUpdate={updateLayer} 
        onSelect={(id) => setState(prev => ({ ...prev, selectedId: id }))} 
        canvasRef={canvasRef}
        onExport={handleExport}
        onSaveTemplate={handleSaveTemplate}
        onReset={handleResetCanvas}
      />

      <PropertiesPanel 
        layer={selectedLayer} 
        onUpdate={updateLayer} 
        onClose={() => setState(prev => ({ ...prev, selectedId: null }))} 
      />

      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
