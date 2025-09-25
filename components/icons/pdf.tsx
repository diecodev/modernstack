export function PdfIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={props.className}
      fill="none"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>PDF file</title>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h1.5a2 2 0 0 1 0 4H9v-4Z" />
      <path d="M13 17v-4h1a2 2 0 1 1 0 4Z" />
      <path d="M17 17v-4h2" />
    </svg>
  );
}
