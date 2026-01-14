
import React, { useState, useRef, useEffect } from 'react';
import { 
  ImageIcon, Maximize, Sparkles, Layers, Trash2, Settings, 
  Type, Square, ChevronUp, ChevronDown, Image as LucideImage, Palette, Pipette, Download, Ban,
  Smartphone, Monitor, Instagram, BookOpen, LayoutTemplate, Edit2, Check, X, Upload, FileDown
} from 'lucide-react';
import { CanvasState, LayerType, Template } from '../types';

interface SidebarProps {
  state: CanvasState;
  setState: React.Dispatch<React.SetStateAction<CanvasState>>;
  addLayer: (type: LayerType, extra?: any) => void;
  reorderLayer: (id: string, direction: 'up' | 'down') => void;
  deleteLayer: (id: string) => void;
  onExport: () => void;
  // Template props
  templates: Template[];
  onLoadTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  onRenameTemplate: (id: string, newName: string) => void;
  onDownloadTemplate: (template: Template) => void;
  onImportTemplate: (file: File) => void;
}

// 预设分辨率列表
const RESOLUTION_PRESETS = [
  { label: '抖音/Shorts', desc: '1080x1920', width: 1080, height: 1920, ratioLabel: '9:16', icon: Smartphone },
  { label: '小红书', desc: '1242x1660', width: 1242, height: 1660, ratioLabel: '3:4', icon: BookOpen },
  { label: 'Instagram', desc: '1080x1350', width: 1080, height: 1350, ratioLabel: '4:5', icon: Instagram },
  { label: 'Instagram', desc: '1080x1080', width: 1080, height: 1080, ratioLabel: '1:1', icon: Square },
  { label: '横屏高清', desc: '1920x1080', width: 1920, height: 1080, ratioLabel: '16:9', icon: Monitor },
  { label: '经典横屏', desc: '1440x1080', width: 1440, height: 1080, ratioLabel: '4:3', icon: Maximize },
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#64748b'
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  state, setState, addLayer, reorderLayer, deleteLayer, onExport,
  templates, onLoadTemplate, onDeleteTemplate, onRenameTemplate,
  onDownloadTemplate, onImportTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'layers' | 'templates'>('project');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setState(prev => ({ ...prev, canvasBackgroundImage: ev.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleLayerImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => addLayer('image', { src: ev.target?.result });
      reader.readAsDataURL(file);
    }
  }

  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        setState(prev => ({ ...prev, canvasBackgroundColor: result.sRGBHex }));
      } catch (e) {
        console.log('EyeDropper canceled or failed');
      }
    } else {
      alert('您的浏览器不支持吸管工具');
    }
  };

  const startEditing = (template: Template) => {
    setEditingTemplateId(template.id);
    setEditNameValue(template.name);
  };

  const saveEditing = () => {
    if (editingTemplateId && editNameValue.trim()) {
      onRenameTemplate(editingTemplateId, editNameValue.trim());
    }
    setEditingTemplateId(null);
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportTemplate(file);
    }
    // 重置 input value 以允许重复导入同一文件
    e.target.value = '';
  }

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl z-30 flex-shrink-0">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h1 className="text-xl font-black text-orange-600 flex items-center gap-2 italic tracking-tighter">
          <Sparkles className="w-6 h-6 fill-orange-500" /> KayingCoverPro
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('project')}
          className={`flex-1 py-3 text-xs font-bold ${activeTab === 'project' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400'}`}
        >
          项目设置
        </button>
        <button 
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-xs font-bold ${activeTab === 'layers' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400'}`}
        >
          图层 ({state.layers.length})
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-3 text-xs font-bold ${activeTab === 'templates' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400'}`}
        >
          模板 ({templates.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {activeTab === 'project' && (
          <>
             {/* 导出按钮 */}
             <button 
                onClick={onExport}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-200 font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
             >
                <Download className="w-4 h-4" /> 导出封面 (PNG)
             </button>

            {/* 画布尺寸 */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Settings className="w-3 h-3" /> 常用分辨率
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {RESOLUTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setState(prev => ({ 
                        ...prev, 
                        width: preset.width, 
                        height: preset.height,
                        aspectRatioLabel: preset.ratioLabel
                    }))}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-start gap-1 relative overflow-hidden ${
                      state.width === preset.width && state.height === preset.height
                      ? 'border-orange-500 bg-orange-50 text-orange-800' 
                      : 'border-slate-100 bg-slate-50 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                        <preset.icon className={`w-3.5 h-3.5 ${state.width === preset.width && state.height === preset.height ? 'text-orange-500' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold">{preset.label}</span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-[10px] font-mono text-slate-500 opacity-80">{preset.desc}</span>
                        <span className="text-[9px] bg-slate-200 px-1 rounded text-slate-500">{preset.ratioLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 text-center">
                 当前画布: {state.width} x {state.height} px
              </div>
            </section>

             <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Palette className="w-3 h-3" /> 画布背景
              </h2>
              
              <div className="space-y-4">
                {/* 纯色背景 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 block mb-2">背景颜色</span>
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="color"
                            value={state.canvasBackgroundColor === 'transparent' ? '#ffffff' : state.canvasBackgroundColor}
                            onChange={(e) => setState(prev => ({ ...prev, canvasBackgroundColor: e.target.value }))}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden shadow-sm disabled:opacity-50"
                            disabled={state.canvasBackgroundColor === 'transparent'}
                        />
                         <button 
                            onClick={handleEyeDropper}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                            title="吸管工具"
                        >
                            <Pipette className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-slate-600 ml-auto">
                            {state.canvasBackgroundColor === 'transparent' ? 'Transparent' : state.canvasBackgroundColor}
                        </span>
                    </div>
                    {/* 预置颜色 */}
                    <div className="flex flex-wrap gap-2">
                        {/* 透明选项 */}
                        <button
                            onClick={() => setState(prev => ({ ...prev, canvasBackgroundColor: 'transparent' }))}
                            className={`w-6 h-6 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-110 checkerboard-bg relative overflow-hidden ${state.canvasBackgroundColor === 'transparent' ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
                            title="透明背景"
                        >
                            <Ban className="w-3 h-3 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </button>

                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setState(prev => ({ ...prev, canvasBackgroundColor: color }))}
                                className={`w-6 h-6 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-110 ${state.canvasBackgroundColor === color ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* 图片背景 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-500">背景图片</span>
                        {state.canvasBackgroundImage && (
                            <button 
                                onClick={() => setState(prev => ({...prev, canvasBackgroundImage: null}))}
                                className="text-[10px] text-red-500 hover:text-red-600 font-bold"
                            >
                                清除图片
                            </button>
                        )}
                    </div>
                    <label className="block cursor-pointer group">
                        <div className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl group-hover:border-orange-400 group-hover:bg-orange-50 transition-all overflow-hidden relative h-20 bg-white">
                        {state.canvasBackgroundImage ? (
                            <img src={state.canvasBackgroundImage} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
                                <span className="text-xs font-bold text-slate-500 group-hover:text-orange-600">上传图片</span>
                            </>
                        )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleBgFileChange} />
                    </label>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'layers' && (
          <div className="flex flex-col h-full">
            {/* 添加工具栏 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => addLayer('text')} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all">
                <Type className="w-5 h-5 mb-1 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500">文本</span>
              </button>
              <button onClick={() => addLayer('shape')} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all">
                <Square className="w-5 h-5 mb-1 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500">形状</span>
              </button>
              <label className="cursor-pointer flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all">
                <LucideImage className="w-5 h-5 mb-1 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500">图片</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleLayerImageAdd} />
              </label>
            </div>

            {/* 图层列表 (倒序显示，顶部在最上) */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {[...state.layers].reverse().map((layer) => (
                <div 
                  key={layer.id}
                  onClick={() => setState(prev => ({ ...prev, selectedId: layer.id }))}
                  className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    state.selectedId === layer.id 
                    ? 'bg-orange-50 border-orange-400 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 bg-slate-100 rounded text-slate-500">
                    {layer.type === 'text' && <Type className="w-3 h-3" />}
                    {layer.type === 'shape' && <Square className="w-3 h-3" />}
                    {layer.type === 'image' && <LucideImage className="w-3 h-3" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-slate-700">
                      {layer.type === 'text' ? (layer as any).text : layer.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{layer.type.toUpperCase()}</p>
                  </div>

                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'up'); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'down'); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {state.layers.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  暂无图层，请添加
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <LayoutTemplate className="w-3 h-3" /> 我的模板
              </h2>
              <label className="cursor-pointer text-orange-500 hover:text-orange-600 flex items-center gap-1 text-[10px] font-bold hover:bg-orange-50 px-2 py-1 rounded transition-colors">
                 <Upload className="w-3 h-3" /> 导入
                 <input type="file" accept=".json" className="hidden" onChange={handleImportChange} />
              </label>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  暂无模板，请在画布右上角点击“保存模板”按钮创建
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:border-orange-300 transition-all shadow-sm">
                    {/* Header: Name and Actions */}
                    <div className="flex items-center justify-between mb-2">
                      {editingTemplateId === template.id ? (
                        <div className="flex items-center gap-1 flex-1 mr-2">
                          <input 
                            type="text" 
                            value={editNameValue} 
                            onChange={(e) => setEditNameValue(e.target.value)}
                            className="w-full text-xs p-1 border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1 text-green-500 hover:bg-green-50 rounded"><Check className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingTemplateId(null); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-700 truncate" title={template.name}>{template.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); startEditing(template); }} className="text-slate-400 hover:text-orange-500"><Edit2 className="w-3 h-3" /></button>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDownloadTemplate(template); }} 
                          className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50"
                          title="下载模板"
                        >
                          <FileDown className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }} 
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                          title="删除模板"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] text-slate-400">
                        <div>{template.state.width} x {template.state.height}</div>
                        <div>{new Date(template.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onLoadTemplate(template);
                        }}
                        className="bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                      >
                        使用模板
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
