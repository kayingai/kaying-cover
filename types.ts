
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:3' | '3:4' | '4:5';
export type LayerType = 'text' | 'shape' | 'image';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  x: number; // 百分比
  y: number; // 百分比
  width: number; // 百分比
  height: number; // 百分比
  rotation: number;
  opacity: number;
  visible: boolean;
  zIndex: number; // 实际上由数组顺序决定，但在某些渲染逻辑中可能用到
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'circle';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  boxShadowEnabled: boolean;
  boxShadowBlur: number;
  boxShadowColor: string;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  textShadowEnabled: boolean;
  textShadowBlur: number;
  textShadowColor: string;
  // 文本层也可以有简单的背景，但主要依靠 ShapeLayer
  backgroundColor: string; 
  padding: number;
  borderRadius: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
}

export type Layer = TextLayer | ShapeLayer | ImageLayer;

export interface CanvasState {
  // 画布底板设置
  canvasBackgroundColor: string;
  canvasBackgroundImage: string | null; // 底图
  
  // 分辨率设置
  width: number;
  height: number;
  aspectRatioLabel: string; // 用于UI显示，例如 "9:16"
  
  // 图层栈
  layers: Layer[];
  selectedId: string | null;
}

export interface Template {
  id: string;
  name: string;
  createdAt: number;
  state: CanvasState;
}
