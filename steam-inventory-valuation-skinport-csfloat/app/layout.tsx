export const metadata = { title: 'Steam Inventory Valuation' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{fontFamily:'system-ui,-apple-system,Segoe UI,Inter,Roboto,Ubuntu',maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <h1 style={{margin:0}}>Steam Inventory Valuation</h1>
          <nav style={{fontSize:14,opacity:.8}}>
            <a href="/" style={{marginRight:12}}>Home</a>
            <a href="https://steamcommunity.com/market/" target="_blank" rel="noreferrer">Steam Market</a>
          </nav>
        </header>
        {children}
        <footer style={{marginTop:48,fontSize:12,opacity:.6}}>Built with Next.js • Not affiliated with Valve.</footer>
      </body>
    </html>
  );
}
