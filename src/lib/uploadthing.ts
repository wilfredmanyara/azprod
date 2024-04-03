import { generateReactHelpers } from "@uploadthing/react/hooks";
 
import type { OurFileRouter } from "@/app/api/uploadthing/core";
 
//hook enabling the upload button to work
export const { useUploadThing } =
  generateReactHelpers<OurFileRouter>();