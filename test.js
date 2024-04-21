const { ethers } = require("ethers");

// Define the message hash and signature
const message = "3042111713577184258";

const messageHash = ethers.utils.id(message)
console.log(messageHash);
const signature = "0x64c3ce1bc3b07146d2a71d5ca3c91e80f85298a7a856a2189d24a7cb5a0ee638378be016d4188641631a91b9f796a499f0f546094fe1db86ed1d04190a50d8811b";


async function extractSigner(messageHash, signature) {
    return ethers.utils.recoverAddress(messageHash, signature);
}


console.log("Signer address:", extractSigner(messageHash, signature));