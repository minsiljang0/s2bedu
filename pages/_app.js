import '../styles/globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Header />
      <main className="wrap" style={{ minHeight: '60vh', paddingTop: 24, paddingBottom: 40 }}>
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  )
}
