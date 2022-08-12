import pinataSDK from "@pinata/sdk";
import path from "path";
import fs from "fs";

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = pinataSDK(pinataApiKey!, pinataApiSecret!);

export async function storeImages(imagesFilePath: string) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  console.log(files);
  let responses = [];
  console.log("Uploading to IPFS");
  for (const fileIndex in files) {
    console.log("Working on " + fileIndex);
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (error) {
      console.error(error);
    }
  }
  return { responses, files };
}

export async function storeTokenUriMetadata(metadata: object) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (error) {
    console.error(error);
  }
}
