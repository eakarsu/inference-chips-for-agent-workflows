import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-mlperf-connector","title":"MLPerf / Bench Connector","description":"Prepare a professional advisory report for mlperf / bench connector using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapMlperfConnector({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
