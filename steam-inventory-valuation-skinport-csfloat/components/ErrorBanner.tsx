export default function ErrorBanner({ message }: { message: string }){
  return (
    <div style={{marginTop:16,padding:12,border:'1px solid #fecaca',background:'#fef2f2',color:'#991b1b',borderRadius:12}}>
      {message}
    </div>
  );
}
