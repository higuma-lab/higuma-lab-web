import type { CollectionEntry } from 'astro:content';

export type ServiceGroupId = CollectionEntry<'services'>['data']['group'];

export interface ServiceGroup {
  id: ServiceGroupId;
  title: string;
  /** トップページのカードに添える短い説明 */
  summary: string;
}

/** サービスの3グループ（D-014）。表示順もこの順 */
export const SERVICE_GROUPS: readonly ServiceGroup[] = [
  {
    id: 'web',
    title: 'Webサイト',
    summary: '新しく作る。自分で作る・更新できるようにする。',
  },
  {
    id: 'app',
    title: 'アプリ開発',
    summary: 'Windows のアプリを中心に、作る・作るのを手伝う。',
  },
  {
    id: 'consulting',
    title: 'IT・AI の相談',
    summary: '道具選びや IT 化の進め方から、AI の使いどころまで。',
  },
];
