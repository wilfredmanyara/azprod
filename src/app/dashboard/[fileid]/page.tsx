import ChatWrapper from "@/components/chat/ChatWrapper"
import PdfRenderer from "@/components/PdfRenderer"
import { db } from "@/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { notFound, redirect } from "next/navigation"


//dynamic data fetching! using params

interface PageProps {
    params: {
        fileid: string
    }
}
//destructure the fileid from the params inorder to get the contents it contains
const Page = async ({params}: PageProps) => {
    const {fileid} = params

//get the user who's linked to the fileid
        const {getUser} = getKindeServerSession()
        const user = getUser()

//if no user is linked it redirects to the dashboard
        if(!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileid}`)

//database call where it looks for the id that matches the file id and userid that matches the user 
//this is to make sure the user only views his/her files

            const file = await db.file.findFirst({
                where: {
                    id: fileid,
                    userId: user.id
                },
            })
//if the fileid is not found a 404 not found page is displayed

            if(!file) notFound()
            
//display the content on the frontend part

        return <div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
            <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
                <div className="flex-1 xl:flex">
                    <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
                        <PdfRenderer url={file.url} />
                    </div>
                </div>

                <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
                    <ChatWrapper fileId={file.id}/>
                </div>
            </div>
        </div>
}

export default Page 