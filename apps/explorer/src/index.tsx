// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
    WalletStandardAdapterProvider,
    UnsafeBurnerWalletAdapter,
} from '@mysten/wallet-adapter-all-wallets';
import { WalletProvider, type WalletProviderProps } from '@mysten/wallet-kit';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import App from './app/App';
import { growthbook } from './utils/growthbook';
import { plausible } from './utils/plausible';
import { reportWebVitals } from './utils/vitals';

import './index.css';

// NOTE: The plausible tracker ensures it doesn't run on localhost, so we don't
// need to gate this call.
plausible.enableAutoPageviews();

if (import.meta.env.PROD) {
    Sentry.init({
        dsn: 'https://e4251274d1b141d7ba272103fa0f8d83@o1314142.ingest.sentry.io/6564988',
        environment: import.meta.env.VITE_VERCEL_ENV,
        integrations: [new BrowserTracing()],
        tracesSampler: () => {
            return growthbook.getFeatureValue('explorer-sentry-tracing', 0);
        },
        beforeSend(event) {
            try {
                // Filter out any code from unknown sources:
                if (
                    !event.exception?.values?.[0].stacktrace ||
                    event.exception?.values?.[0].stacktrace?.frames?.[0]
                        .filename === '<anonymous>'
                ) {
                    return null;
                }
            } catch (e) {}

            return event;
        },

        denyUrls: [
            // Chrome extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /<anonymous>/,
        ],
        allowUrls: [
            /.*\.sui\.io/i,
            /.*-mysten-labs\.vercel\.app/i,
            'explorer-topaz.vercel.app',
        ],
    });
}

const adapters: WalletProviderProps['adapters'] = [
    new WalletStandardAdapterProvider(),
];
if (import.meta.env.DEV) {
    adapters.push(new UnsafeBurnerWalletAdapter());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WalletProvider adapters={adapters} autoConnect={false}>
            <Router>
                <App />
            </Router>
        </WalletProvider>
    </React.StrictMode>
);

reportWebVitals();
