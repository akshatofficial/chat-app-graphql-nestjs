import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {Request, Response} from 'express'
import { User } from '@prisma/client';
import { LoginDto, RegisterDto } from 'src/auth/dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService
    ) {}

    async refreshToken(req:Request, res:Response) {
        const refresh_token = req.cookies?.refresh_token;

        if(!refresh_token) throw new UnauthorizedException("Refresh token not found");

        let payload;

        try {
            payload = this.jwtService.verify(refresh_token, {
                secret: this.configService.get<string>("REFRESH_TOKEN_SECRET")
            });
        } catch (err) {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }

        const user = await this.prisma.user.findUnique({where: {id: payload.sub}});
        if(!user) throw new BadRequestException("User does not exists");

        const expirationTime = 15000;
        const absoluteExpirationTime = Math.floor(Date.now() / 1000) + expirationTime;
        
        const access_token = this.jwtService.sign({...payload, exp: absoluteExpirationTime}, {
            secret: this.configService.get<string>("ACCESS_TOKEN_SECRET")
        })

        res.cookie("access_token", access_token, {httpOnly: true});

        return access_token
    }

    private async issueTokens(user: User, res: Response) {
        const payload = {username: user.fullname, sub: user.id};

        const accessToken = this.jwtService.sign({...payload}, {secret: this.configService.get<string>("ACCESS_TOKEN_SECRET"), expiresIn: "150sec"});
        const refreshToken = this.jwtService.sign({...payload}, {secret: this.configService.get<string>("REFRESH_TOKEN_SECRET"), expiresIn: "7d"});

        res.cookie("access_token", accessToken, {httpOnly: true})
        res.cookie("refresh_token", refreshToken, {httpOnly: true})

        return {user};
    }

    private async validateUser(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({where: {email: loginDto.email}});
        const isPasswordCorrect = await bcrypt.compare(loginDto.password, user.password);
        if(user && isPasswordCorrect) return user;
        return null;
    }

    async registerUser(registerDto: RegisterDto, res: Response) {
        const isAlreadyExistUser = await this.prisma.user.findUnique({where: {email: registerDto.email}});

        if(isAlreadyExistUser) throw new BadRequestException({email: "Email already in use"});

        const hashedPassword = await bcrypt.hash(registerDto.password, 10); 
        const user = await this.prisma.user.create({data: {
            email: registerDto.email,
            fullname: registerDto.fullname,
            password: hashedPassword
        }});

        return this.issueTokens(user, res);
    }

    async loginUser(loginDto: LoginDto, res: Response) {
        const user = await this.validateUser(loginDto);

        if(!user) throw new BadRequestException({invalidCredentials: "Invalid Credentials"});

        return this.issueTokens(user, res);
    }

    async logoutUser(res: Response) {
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        return "Successfully logged out!";
    }
}
