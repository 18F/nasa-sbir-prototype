const db = require("./knex");
const { getContract } = require("./contracts");
const { getFirm } = require("./firms");

const getProposalsForProgramYear = async (year = false) => {
  const programYear =
    year !== false
      ? year
      : (await db("proposals").max("program_year").first()).max;

  return db("proposals").where({ program_year: programYear }).select();
};

const getProposal = async (proposalId) => {
  const proposal = await db("proposals").where({ id: proposalId }).first();

  if (proposal) {
    const {
      contract_id: contractId,
      firm_id: firmId,
      previous_proposal_id: previousId,
    } = proposal;

    proposal.awarded = !!contractId;

    if (contractId) {
      proposal.contract = await getContract(contractId);
      proposal.firm = await getFirm(firmId);

      delete proposal.contract_id;
      delete proposal.firm_id;
    }

    if (previousId) {
      proposal.previous = await getProposal(previousId);
      delete proposal.previous_proposal_id;
    }
  }

  return proposal;
};

module.exports = { getProposal, getProposalsForProgramYear };
