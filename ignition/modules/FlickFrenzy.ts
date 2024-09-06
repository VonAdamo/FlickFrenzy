import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FlickFrenzyModule = buildModule("FlickFrenzyModule", (m) => {

  const flickFrenzy = m.contract("FlickFrenzy", [], {});

  return { flickFrenzy };
});

export default FlickFrenzyModule;
