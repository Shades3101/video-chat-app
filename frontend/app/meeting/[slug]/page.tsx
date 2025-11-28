import axios from "axios";


async function getRoomId (slug: string) {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/room/${slug}`)

    return response.data.id
}

export default async function Chat({params}: {
    params: {
        slug: string
    }
}){

    const slug = (await params).slug;
    const roomId = await getRoomId(slug)

    return <ChatRoom id = {roomId}/>
}