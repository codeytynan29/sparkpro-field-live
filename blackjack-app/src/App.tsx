import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { HashRouter, Route, Routes, Link } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Toasts } from './components/Toasts'
import { initSync } from './state/sync'
import { getProgress, replace } from './state/store'
import Home from './pages/Home'

const Play = lazy(() => import('./pages/Play'))
const Learn = lazy(() => import('./pages/Learn'))
const LessonPage = lazy(() => import('./pages/Lesson'))
const Practice = lazy(() => import('./pages/Practice'))
const Etiquette = lazy(() => import('./pages/Etiquette'))
const Strategy = lazy(() => import('./pages/Strategy'))
const Counting = lazy(() => import('./pages/Counting'))
const ProgressPage = lazy(() => import('./pages/Progress'))
const Settings = lazy(() => import('./pages/Settings'))

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="panel mx-auto mt-10 max-w-md p-6 text-center">
          <h2 className="font-display text-2xl text-cream-50">Something went wrong</h2>
          <p className="mt-2 text-sm text-cream-300/70">Your progress is saved. Reload to get back to the table.</p>
          <p className="mt-2 break-words font-mono text-[11px] text-cream-300/40">{String(this.state.error.message)}</p>
          <button className="btn-gold mt-4" onClick={() => { this.setState({ error: null }); location.hash = '#/'; location.reload() }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-400/20 border-t-gold-300" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="panel mx-auto mt-10 max-w-md p-6 text-center">
      <h2 className="font-display text-2xl text-cream-50">No table here</h2>
      <p className="mt-2 text-sm text-cream-300/70">That page doesn’t exist.</p>
      <Link to="/" className="btn-gold mt-4">Back to the lobby</Link>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    initSync(getProgress, replace).catch(() => {})
  }, [])
  return (
    <HashRouter>
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play" element={<Play />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:lessonId" element={<LessonPage />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/etiquette" element={<Etiquette />} />
              <Route path="/strategy" element={<Strategy />} />
              <Route path="/counting" element={<Counting />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
      <Toasts />
    </HashRouter>
  )
}
