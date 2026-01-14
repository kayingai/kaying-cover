import React from 'react';
import { Type as FontIcon, Square, Image as ImageIcon, MousePointer2 } from 'lucide-react';
import { Layer, TextLayer, ShapeLayer, ImageLayer } from '../types';

interface PropertiesProps {
  layer: Layer | null;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onClose: () => void; // 保留接口但不再使用
}

const FONTS = ['Inter', 'Bebas Neue', 'Montserrat', 'Noto Sans SC', 'serif'];

export const PropertiesPanel: React.FC<PropertiesProps> = ({ layer, onUpdate }) => {
  if (!layer) {
    return (
      <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col items-center justify-center text-center p-8 shadow-xl z-30 flex-shrink-0">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <MousePointer2 className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">未选择元素</h3>
        <p className="text-xs text-slate-400 max-w-[200px]">点击画布上的文本、形状或图片图层，在此处编辑其属性。</p>
      </aside>
    );
  }

  return (
    <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-30 overflow-y-auto flex-shrink-0">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-2">
          {layer.type === 'text' && <FontIcon className="w-4 h-4 text-orange-500" />}
          {layer.type === 'shape' && <Square className="w-4 h-4 text-orange-500" />}
          {layer.type === 'image' && <ImageIcon className="w-4 h-4 text-orange-500" />}
          属性设置
        </h2>
      </div>

      <div className="p-6 space-y-8">
        
        {/* 通用属性: 尺寸与位置 */}
        <div className="space-y-4 pb-6 border-b border-slate-100">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">布局</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">宽度 (%)</span>
                <input type="number" value={Math.round(layer.width)} onChange={(e) => onUpdate(layer.id, { width: Number(e.target.value) })} className="w-full p-2 bg-slate-50 rounded-lg text-xs" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">高度 (%)</span>
                <input type="number" value={Math.round(layer.height)} onChange={(e) => onUpdate(layer.id, { height: Number(e.target.value) })} className="w-full p-2 bg-slate-50 rounded-lg text-xs" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">不透明度</span>
                <input type="range" min="0" max="100" value={layer.opacity} onChange={(e) => onUpdate(layer.id, { opacity: Number(e.target.value) })} className="w-full" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">旋转</span>
                <input type="range" min="0" max="360" value={layer.rotation} onChange={(e) => onUpdate(layer.id, { rotation: Number(e.target.value) })} className="w-full" />
              </div>
           </div>
        </div>

        {layer.type === 'text' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">文本内容</label>
              <textarea 
                value={(layer as TextLayer).text}
                onChange={(e) => onUpdate(layer.id, { text: e.target.value } as any)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">字体</span>
                <select 
                  value={(layer as TextLayer).fontFamily}
                  onChange={(e) => onUpdate(layer.id, { fontFamily: e.target.value } as any)}
                  className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-100 rounded-xl"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">对齐</span>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button 
                      key={align}
                      onClick={() => onUpdate(layer.id, { textAlign: align } as any)}
                      className={`flex-1 flex justify-center py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${(layer as TextLayer).textAlign === align ? 'bg-white shadow text-orange-600' : 'text-slate-400'}`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1">
                  <span>字号 (不影响框体)</span>
                  <span>{(layer as TextLayer).fontSize}px</span>
                </div>
                <input type="range" min="12" max="200" value={(layer as TextLayer).fontSize} onChange={(e) => onUpdate(layer.id, { fontSize: +e.target.value } as any)} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">文本颜色</span>
                    <input type="color" value={(layer as TextLayer).color} onChange={(e) => onUpdate(layer.id, { color: e.target.value } as any)} className="w-full h-10 rounded-xl cursor-pointer border-0 p-0 overflow-hidden" />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">背景颜色</span>
                    <input type="color" value={(layer as TextLayer).backgroundColor} onChange={(e) => onUpdate(layer.id, { backgroundColor: e.target.value } as any)} className="w-full h-10 rounded-xl cursor-pointer border-0 p-0 overflow-hidden" />
                 </div>
              </div>
              
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase">背景圆角</span>
                 <input type="range" min="0" max="100" value={(layer as TextLayer).borderRadius || 0} onChange={(e) => onUpdate(layer.id, { borderRadius: +e.target.value } as any)} className="w-full" />
              </div>

              <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase">文字阴影</span>
                 <div className="flex items-center gap-2">
                    <input type="checkbox" checked={(layer as TextLayer).textShadowEnabled} onChange={(e) => onUpdate(layer.id, { textShadowEnabled: e.target.checked } as any)} />
                    <input type="range" disabled={!(layer as TextLayer).textShadowEnabled} min="0" max="20" value={(layer as TextLayer).textShadowBlur} onChange={(e) => onUpdate(layer.id, { textShadowBlur: +e.target.value } as any)} className="flex-1" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {layer.type === 'shape' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">填充颜色</span>
                <input type="color" value={(layer as ShapeLayer).backgroundColor} onChange={(e) => onUpdate(layer.id, { backgroundColor: e.target.value } as any)} className="w-full h-10 rounded-xl" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">边框颜色</span>
                <input type="color" value={(layer as ShapeLayer).borderColor} onChange={(e) => onUpdate(layer.id, { borderColor: e.target.value } as any)} className="w-full h-10 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">边框宽度</span>
                <input type="range" min="0" max="100" value={(layer as ShapeLayer).borderWidth} onChange={(e) => onUpdate(layer.id, { borderWidth: +e.target.value } as any)} className="w-full" />
            </div>

            <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">圆角</span>
                <input type="range" min="0" max="100" value={(layer as ShapeLayer).borderRadius} onChange={(e) => onUpdate(layer.id, { borderRadius: +e.target.value } as any)} className="w-full" />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-widest">阴影</h3>
                <input type="checkbox" checked={(layer as ShapeLayer).boxShadowEnabled} onChange={(e) => onUpdate(layer.id, { boxShadowEnabled: e.target.checked } as any)} className="accent-orange-500" />
              </div>
              {(layer as ShapeLayer).boxShadowEnabled && (
                <input type="range" min="0" max="50" value={(layer as ShapeLayer).boxShadowBlur} onChange={(e) => onUpdate(layer.id, { boxShadowBlur: +e.target.value } as any)} className="w-full" />
              )}
            </div>
          </div>
        )}

        {layer.type === 'image' && (
             <div className="space-y-6">
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">适应模式</span>
                    <select 
                    value={(layer as ImageLayer).objectFit}
                    onChange={(e) => onUpdate(layer.id, { objectFit: e.target.value } as any)}
                    className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-100 rounded-xl"
                    >
                    <option value="contain">适应 (Contain)</option>
                    <option value="cover">填充 (Cover)</option>
                    <option value="fill">拉伸 (Fill)</option>
                    </select>
                </div>
             </div>
        )}
      </div>
    </aside>
  );
};