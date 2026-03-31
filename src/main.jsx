import React from 'react'
import ReactDOM from 'react-dom/client'
import { PhantomProvider, darkTheme, AddressType } from '@phantom/react-sdk'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PhantomProvider
      config={{
        providers: ['google', 'apple', 'phantom', 'injected', 'deeplink'],
        appId: '656b4ef2-7acc-44fe-bec7-4b288cfdd2e9',
        addressTypes: [AddressType.solana, AddressType.ethereum],
        authOptions: {
          redirectUrl: window.location.origin + '/',
        },
      }}
      theme={darkTheme}
      appIcon="https://molochdagod.github.io/ObjectStore/branding/favicons/grudge-icon-180x180.png"
      appName="Grudge Warlords"
    >
      <App />
    </PhantomProvider>
  </React.StrictMode>,
)
