import { cookies } from "next/headers";
import { BACKEND_URL } from "./config";
import axios from "axios";

export default async function getUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            console.log("No access_token cookie found");
            return null;
        }

        console.log("Fetching user with token:", token.substring(0, 20) + "...");

        const res = await axios.get(`${BACKEND_URL}/me`, {
            headers: {
                Cookie: `access_token=${token}`
            },
        });

        if (!res.data || !res.data.data) {
            console.log("No user data in response");
            return null;
        }

        console.log("User fetched successfully:", res.data.data.email);
        return res.data.data;
    } catch (error: any) {
        console.log("Error fetching user:", error.response?.data || error.message);
        return null;
    }
}
