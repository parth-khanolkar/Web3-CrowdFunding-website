import React, { useContext, createContext } from 'react';

import { useAddress, useContract, useMetamask, useContractWrite, useContractRead } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

export const StateContextProvider = ({children}) => {
    // const { contract } = useContract('0xC037460FeE42D315Bb6cDFe418cF0D9f9EbfdCfC');
    const { contract } = useContract("0xC037460FeE42D315Bb6cDFe418cF0D9f9EbfdCfC");

    const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');
    const { mutateAsync: donateToCampaign } = useContractWrite(contract, "donateToCampaign")

    const contractRead = ({contract, functionName,pId}) => {
        
        useContractRead(contract,{functionName},[pId]);
    }
    const address = useAddress();
    //const ethereumAddress = web3.utils.toChecksumAddress(address);
    const connect = useMetamask();

    const publishCampaign = async(form) => {
        
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

        const parsedCampaigns = campaigns.map((campaign,i) => ({
            owner: campaign.owner,
            title: campaign.title,
            description: campaign.description,
            target: ethers.utils.formatEther(campaign.target.toString()),
            deadline: campaign.deadline.toNumber(),
            amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
            image: campaign.image,
            pId: i,
        }));

        return parsedCampaigns;
    }

    const getUserCampaigns = async() => {
        const allCampaigns = await getCampaigns();

        const filteredCampaigns = allCampaigns.filter((campaign)=> campaign.owner === address);

        return filteredCampaigns;
    }

    const donate = async (pId,amount) => {
        // console.log(contract);
        // console.log(contract.call('donateToCampaign', pId, {value: ethers.utils.parseEther(amount)}));
        

        // const data = await contract.call('donateToCampaign', pId, {value: ethers.utils.parseEther(amount)});

        // return data;
        console.log("Donate PID:",pId );
        try {
            const data = await donateToCampaign({ args: [pId] });
            console.info("contract call successs", data);
          } catch (err) {
            console.error("contract call failure", err);
          }
        
    };

    const getDonations = async(pId) => {
        // const donations = await contract.call('getDonators', pId);
        console.log("PID:",pId);
        const donations  = contractRead(contract, "getDonators", [pId])


        const numberOfDonations = donations[0].length;

        const parsedDonations = [];

        for(let i = 0; i<numberOfDonations; i++)
        {
            parsedDonations.push({
                donator: donations[0][i],
                donation: ethers.utils.formatEther(donations[1][i].toString())
            })
        }

        return parsedDonations;
    }


    return(
        <StateContext.Provider 
            value = {{ 
                address,
                contract,
                connect,
                createCampaign : publishCampaign,
                getCampaigns,
                getUserCampaigns,
                donate,
                getDonations,
             }}
        >
            {children}
        </StateContext.Provider>
    )

}

export const useStateContext = () => useContext(StateContext);
