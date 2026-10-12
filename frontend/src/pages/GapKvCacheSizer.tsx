import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-kv-cache-sizer","title":"KV Cache Sizer","description":"Prepare a professional advisory report for kv cache sizer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapKvCacheSizer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
