import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  id?: string;
}

/** HUD panel: glass background, glowing corner brackets, uppercase title strip. */
export function Panel({ title, action, className = '', children, id }: PanelProps) {
  return (
    <section className={`panel ${className}`} id={id}>
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />
      {title && (
        <header className="panel-head">
          <h2>{title}</h2>
          {action}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
