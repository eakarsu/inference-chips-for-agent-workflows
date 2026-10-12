import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-hdl-linkage","title":"HDL (Verilog/Chisel) Linkage","description":"Prepare a professional advisory report for hdl (verilog/chisel) linkage using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapHdlLinkage({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
