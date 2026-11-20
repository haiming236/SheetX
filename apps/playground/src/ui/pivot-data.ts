/**
 * SheetX 第 13 张 · 数据透视表 — 静态数据
 *
 * 源数据共 20 行：前 12 行与设计稿源表逐字一致，追加 8 行后
 * 「地区 × 产品」透视结果与设计稿透视表完全吻合
 * （华东 68,100 / 华南 57,600 / 华北 21,700 / 东北 23,500 / 西南 9,900，
 *   总计 180,800，计数 20）。
 */
import type { IconName } from './icons.js'

export const TOP_MENUS = ['文件', '开始', '插入', '数据', '透视表', '视图', '设置']

export interface SourceRecord {
  date: string
  region: string
  product: string
  sales: number
}

const R = (date: string, region: string, product: string, sales: number): SourceRecord =>
  ({ date: `2025-${date}`, region, product, sales })

export const SOURCE_RECORDS: SourceRecord[] = [
  R('01-01', '东北', '笔记本', 12500),
  R('01-02', '华东', '笔记本', 15800),
  R('01-03', '华南', '显示器', 9800),
  R('01-04', '华北', '键盘', 7200),
  R('01-05', '华东', '笔记本', 13200),
  R('01-06', '华南', '鼠标', 8600),
  R('01-07', '东北', '显示器', 11000),
  R('01-08', '华北', '笔记本', 14500),
  R('01-09', '华东', '键盘', 7300),
  R('01-10', '华南', '笔记本', 12000),
  R('01-11', '西南', '显示器', 9900),
  R('01-12', '华东', '鼠标', 8700),
  R('01-13', '华东', '显示器', 4900),
  R('01-14', '华东', '显示器', 4900),
  R('01-15', '华东', '笔记本', 6600),
  R('01-16', '华东', '笔记本', 6700),
  R('01-17', '华南', '笔记本', 10000),
  R('01-18', '华南', '笔记本', 6000),
  R('01-19', '华南', '笔记本', 4000),
  R('01-20', '华南', '键盘', 7200),
]

/** 字段列表（勾选控制源表列显隐） */
export const FIELD_LIST = ['日期', '地区', '产品', '销售额']

/** 维度值偏好顺序（地区按设计稿汇总降序，产品按设计稿列序） */
export const REGION_ORDER = ['华东', '华南', '华北', '东北', '西南']
export const PRODUCT_ORDER = ['笔记本', '显示器', '键盘', '鼠标']

export const ROW_FIELD_OPTIONS = ['地区', '产品', '日期']
export const COL_FIELD_OPTIONS = ['产品', '地区', '日期']
export const FILTER_FIELD_OPTIONS = ['地区', '产品', '日期']

export const AGG_OPTIONS = ['求和', '平均值', '计数', '最大值', '最小值']
export const FORMAT_OPTIONS = ['无小数', '两位小数', '纯数字']

export const PANEL_TABS = ['分析', '设计', '样式']
export const SHEET_TABS = ['销售数据', '数据透视表', '图表分析']

/** 行/列/值/筛选卡图标 */
export const DROP_ICONS: Record<string, IconName> = {
  筛选器: 'filter',
  列: 'colsV',
  行: 'group',
  值: 'sigma',
}
