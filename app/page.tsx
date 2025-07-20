export default function HomePage() {
  return (
    <div>
      <script dangerouslySetInnerHTML={{
        __html: `window.location.href = '/index.html';`
      }} />
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/index.html" />
      </noscript>
    </div>
  )
}