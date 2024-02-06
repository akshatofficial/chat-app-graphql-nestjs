import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class GraphqlAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ){}

    private tokenExtractionFromCookie(req: Request): string| undefined {
        return req.cookies?.access_token;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const gqlContext = context.getArgByIndex(2);
        const request: Request = gqlContext.req;
        const token = this.tokenExtractionFromCookie(request);

        if(!token) throw new UnauthorizedException();

        try{ 
            const payload = await this.jwtService.verifyAsync(token, {secret:  this.configService.get<string>("ACCESS_TOKEN_SECRET")})
            request.user = payload;
        }catch(e) {
            console.log(e);
            throw new UnauthorizedException();
        }

        return true;
    }
}