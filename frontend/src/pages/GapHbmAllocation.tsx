import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-hbm-allocation","title":"HBM Allocation Tracking","description":"Prepare a professional advisory report for hbm allocation tracking using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapHbmAllocation({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
