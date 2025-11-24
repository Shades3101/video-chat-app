import jwt, { type JwtPayload } from "jsonwebtoken";
import { secret } from "./authMiddleware.js";

export default function wsAuthMiddleware(token: string): string | null {

    //disabled for testing purposes


    // try {
    //     const vtoken = jwt.verify(token, secret)

    //     if (typeof vtoken == "string") {
    //         return null
    //     }

    //     if (!vtoken || !vtoken.userId) {
    //         return null
    //     }
    //     console.log("user reached here")
    //     return vtoken.userId

    // } catch (e) {
    //     console.log(e);
    // }
    return null;
}