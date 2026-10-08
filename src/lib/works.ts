import type { CollectionEntry } from 'astro:content';

export type WorkKind = CollectionEntry<'works'>['data']['kind'];
export type WorkStatus = CollectionEntry<'works'>['data']['status'];

/** 種別ラベルの表示名（D-001、D-029） */
export const WORK_KIND_LABELS: Record<WorkKind, string> = {
  'own-product': '自社プロダクト',
  sample: 'サンプル制作',
  experiment: '技術検証',
  client: 'お客様案件',
};

/** 状態ラベルの表示名（docs/design.md 12.5） */
export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  released: '公開中',
  upcoming: '公開予定',
  'in-progress': '開発中',
};
