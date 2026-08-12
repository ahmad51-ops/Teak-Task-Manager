const Footer = () => (
  <footer className="border-t border-surface-3 px-6 py-4 md:px-10">
    <div className="flex flex-col items-center justify-between gap-2 text-xs text-ink-faint md:flex-row">
      <p>© {new Date().getFullYear()} NOVA. Built for teams that ship.</p>
      <p className="font-mono">v0.1.0</p>
    </div>
  </footer>
);

export default Footer;
