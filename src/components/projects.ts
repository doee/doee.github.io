import { defineComponent } from '../engine/component';
import { projects } from '../content/projects';

/** Renders src/content/projects.ts as an expandable list. */
// Keys are lowercase so 'javascript' and 'JavaScript' both match.
const LANG: Record<string, { label: string; color: string }> = {
  swift: { label: 'Swift', color: 'var(--bubble)' },
  javascript: { label: 'JavaScript', color: 'var(--butter)' },
  typescript: { label: 'TypeScript', color: 'var(--cobalt-soft)' },
  java: { label: 'Java', color: 'var(--bubble)' },
  html: { label: 'HTML', color: 'var(--butter)' },
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const langs = (language: string | string[]) =>
  [language]
    .flat()
    .map((l) => {
      const known = LANG[l.toLowerCase()];
      return `<span class="project-lang" style="--chip:${known?.color ?? 'var(--white)'}">${esc(known?.label ?? l)}</span>`;
    })
    .join('');

// With a single project there is nothing to scan, so show it open.
const startOpen = projects.length === 1;

export default defineComponent({
  name: 'projects',
  eager: true,
  mount(list) {
    list.innerHTML = projects
      .map((p, i) => {
        const id = `project-${i}`;
        const links = (p.links ?? [])
          .map((l) => `<a class="project-link" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
          .join('');
        return `
        <li class="project${startOpen ? ' is-open' : ''}">
          <h3 class="project-heading">
            <button class="project-toggle" type="button" aria-expanded="${startOpen}" aria-controls="${id}">
              <span class="project-name">${esc(p.name)}</span>
              <span class="project-summary">${esc(p.summary)}</span>
              <span class="project-langs">${langs(p.language)}</span>
              <span class="project-icon" aria-hidden="true"></span>
            </button>
          </h3>
          <div class="project-body" id="${id}">
            <div class="project-body-inner">
              <p>${esc(p.details)}</p>
              ${p.stack?.length ? `<ul class="project-stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
              ${links ? `<div class="project-links">${links}</div>` : ''}
            </div>
          </div>
        </li>`;
      })
      .join('');

    list.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.project-toggle');
      if (!btn) return;
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.closest('.project')!.classList.toggle('is-open', open);
    });
  },
});
