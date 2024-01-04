import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse, RegisterResponse } from './types';
import { LoginDto, RegisterDto } from 'src/user/dto';
import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';

@Resolver()
export class AuthResolver {
    constructor(
        private authService: AuthService
    ){}

    @Mutation(() => RegisterResponse)
    async register(@Args("registerInput") registerDto: RegisterDto, @Context() context: {res: Response}) {
        if(registerDto.confirmPassword !== registerDto.password) throw new BadRequestException({confirmPassword: "Password and confirm password must be same"});

        return await this.authService.registerUser(registerDto, context.res)
    }

    @Mutation(() => LoginResponse)
    async login(@Args("loginInput") loginDto: LoginDto, @Context() context: {res: Response}) {
        return await this.authService.loginUser(loginDto, context.res)
    }

    @Mutation(() => String)
    async logout(@Context() context: {res: Response}) {
        return await this.authService.logoutUser(context.res);
    }

    @Mutation(() => String)
    async refreshToken(@Context() context: {req: Request; res: Response}) {
        try {
            return this.authService.refreshToken(context.req, context.res)
        }catch(err) {
            throw new BadRequestException(err.message);
        }
    }
}
