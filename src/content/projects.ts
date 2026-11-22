/**
 * Edit this file to change the "What I'm building" list.
 * links are optional; leave them out for private repos.
 */
export interface Project {
  name: string;
  /** One line, shown in the collapsed row. */
  summary: string;
  /** A short paragraph, shown when the row is opened. */
  details: string;
  /** One language or several, e.g. 'Swift' or ['Swift', 'JavaScript']. */
  language: string | string[];
  stack?: string[];
  links?: { label: string; href: string }[];
}

export const projects: Project[] = [
  {
    name: 'Local Music Player',
    summary: 'My own music library, streamable through tailscale.',
    details:
      'A self-hosted music library with a web player styled after Apple Music and a sideloadable iPhone app, so my collection plays everywhere without a subscription.',
    language: ['Swift', 'javascript'],
    stack: ['Swift', 'SwiftUI', 'Web player', 'Self-hosted server'],
  },
];
