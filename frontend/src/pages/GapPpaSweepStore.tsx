import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-ppa-sweep-store","title":"PPA Sweep Storage","description":"Prepare a professional advisory report for ppa sweep storage using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapPpaSweepStore({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
