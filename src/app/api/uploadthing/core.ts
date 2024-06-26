import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import {PDFLoader} from "langchain/document_loaders/fs/pdf"
import {OpenAIEmbeddings} from "langchain/embeddings/openai"
import {PineconeStore} from "langchain/vectorstores/pinecone"
import { pinecone } from '@/lib/pinecone'
 
const f = createUploadthing();
 
export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "8MB" } })
  //receives upload request from the user
    .middleware(async ({ req }) => { 
   //making sure only logged in or authorised users can request
        const {getUser} = getKindeServerSession()
        const user = getUser()
  //unauthourised users cannot perform a request
        if(!user || !user.id) throw new Error("Unauthorized")

      return {userId: user.id};
    })
    //callback function via the onUploadComplete webhook
     .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
          uploadStatus: "PROCESSING",
        },
      })

      try {
        const response = await fetch (`https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`)
        const blob = await response.blob()

        const loader = new PDFLoader(blob)

        const pagelevelDocs = await loader.load()

        const pagesAmt = pagelevelDocs.length

        const pineconeIndex = pinecone.Index('azprod');

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

await PineconeStore.fromDocuments(pagelevelDocs, embeddings, {
  pineconeIndex,
});

        await db.file.update({
          data: {
            uploadStatus: "SUCCESS"
          },
          where: {
            id: createdFile.id 
          }
        })

      } catch (err) {
        await db.file.update({
          data: {
            uploadStatus: "FAILED"
          },
          where: {
            id: createdFile.id 
          },
        })
      }

    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;