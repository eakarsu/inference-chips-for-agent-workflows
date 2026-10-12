import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-agent-loop-profiler","title":"Agent Loop Profiler","description":"Prepare a professional advisory report for agent loop profiler using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfAgentLoopProfiler({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
