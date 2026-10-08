/**
 * SNS リンク（D-012）。url が空の項目は表示しない。
 * TODO: 各 SNS の URL が確定したら設定する（decisions.md の TODO）。
 * GitHub はリポジトリの公開後に設定する（D-007）。
 */

export type SocialIcon = 'github' | 'x' | 'instagram';

export interface SocialLink {
  label: string;
  icon: SocialIcon;
  url: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'GitHub', icon: 'github', url: '' },
  { label: 'X', icon: 'x', url: '' },
  { label: 'Instagram', icon: 'instagram', url: '' },
];

export const activeSocialLinks = (): SocialLink[] => SOCIAL_LINKS.filter((link) => link.url !== '');
