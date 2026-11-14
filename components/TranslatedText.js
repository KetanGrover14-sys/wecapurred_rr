// Keep a DOM element around changing text: browser translation can replace the
// text node itself. Remount on changes so React never updates a detached node.
export default function TranslatedText({ children }) {
  return <span key={String(children)}>{children}</span>;
}
