// rosezm project config - AT Command Debugger 1:1 port.
// The /api proxy lives in src/pages/_middleware.rose (the body-aware hook):
// rosezm dev serves the live-rebuilt UI, the original Python backend
// (python3 main.py --browser) owns POST /api/*. In production the Python
// server hosts dist/ on one origin and the proxy never fires.
export default [];
