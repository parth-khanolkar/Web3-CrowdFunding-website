import React, { useContext, createContext } from 'react';

import { useAddress, useContract, useMetamask, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { EditionMetadataWithOwnerOutputSchema } from '@thirdweb-dev/sdk';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract('0xC037460FeE42D315Bb6cDFe418cF0D9f9EbfdCfC');
//   const { contract } = useContract('0xf59A1f8251864e1c5a6bD64020e3569be27e6AA9');
  
  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');
  // const { mutateAsync: donateToCampaign } = useContractWrite(contract, "donateToCampaign")

  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form) => {
    try{
      console.log("Object in Context : ",form);
      const data = await createCampaign({args:[
          //ethereumAddress, //owner
          address, //owner
          form.title, //title of campaign
          form.description, 
          form.target,
          new Date(form.deadline).getTime(), //deadline
          form.image
      ]})
      console.log("Contract call success", data);
  } catch (error){
      console.log("Contract call FAILED", error);
      
  }
  }

  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns');

    const parsedCampaings = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }));

    return parsedCampaings;
  }

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

    return filteredCampaigns;
  }

  const donate = async (pId, amount) => {
    
    const data = await contract.call(
      'donateToCampaign', 
      [ pId ],
      {
        value: ethers.utils.parseEther(amount), // send 0.1 ether with the contract call
      }
      );

    return data;
  }

  const getDonations = async (pId) => {
    console.log("Index Pid",pId);
    const donations = await contract.call('getDonators', [pId]);
    const numberOfDonations = donations[0].length;
    const parsedDonations = [];

    for(let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      })
    }

    return parsedDonations;
  }


  return (
    <StateContext.Provider
      value={{ 
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

export const useStateContext = () => useContext(StateContext);