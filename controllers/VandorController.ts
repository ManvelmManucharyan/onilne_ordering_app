import { Request, Response, NextFunction } from 'express';
import { CreateFoodInput, EditVandorInput, VandorLoginInputs } from '../dto';
import { FindVandor } from './AdminController';
import { GenerateSignature, ValidatePassword } from '../utility';
import { Food } from '../models';

export const VandorLogin = async (req: Request, res: Response, next: NextFunction) => {

    const { email, password } = <VandorLoginInputs>req.body

    const vandor = await FindVandor('', email);

    if(vandor){
        const validation = await ValidatePassword(password, vandor.password, vandor.salt);

        if(validation){
            const signature = GenerateSignature({ 
                _id: vandor._id, 
                email: vandor.email,
                foodTypes: vandor.foodType,
                name: vandor.name
             })
            return res.json(signature);
        } else {
            return res.json({ message: 'Password is not valid' })
        }
    }

    return res.json({ message: 'Login credential not valid' });
}

export const GetVandorProfile = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if(user) {
        const vandor = await FindVandor(user._id);

        return res.json(vandor);
    }

    return res.json({ message: "Vandor not found" });

}

export const UpdateVandorProfile = async (req: Request, res: Response, next: NextFunction) => {

    const { name, address, phone, foodTypes } = <EditVandorInput>req.body;
    const user = req.user;

    if(user) {
        const vandor = await FindVandor(user._id);

        if(vandor) {
            name ? vandor.name = name : false;
            address ? vandor.address = address : false;
            phone ? vandor.phone = phone : false;
            foodTypes ? vandor.foodType = foodTypes : false;

            const savedVandor = await vandor.save();
            return res.json(savedVandor); 
        }
        return res.json(vandor);
    }

    return res.json({ message: "Vandor not found" });

}

export const UpdateVandorCoverImage = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if(user) {

        const vandor = await FindVandor(user._id);

        if(vandor) {

            const files = req.files as [Express.Multer.File];

            const images = files.map((file: Express.Multer.File) => file.filename);

            vandor.coverImages.push(...images);

            const result = await vandor.save();

            return res.json(result);
        }

    }

    return res.json({ message: "Something went wrong" });
}

export const UpdateVandorService = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if(user) {
        const vandor = await FindVandor(user._id);

        if(vandor) {
            vandor.serviceAvailable = !vandor.serviceAvailable;
            const savedVandor = await vandor.save();
            return res.json(savedVandor); 
        }

    }

    return res.json({ message: "Vandor not found" });
}

export const AddFood = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if(user) {

        const { name, description, category, foodType, readyTime, price } = <CreateFoodInput>req.body;

        const vandor = await FindVandor(user._id);

        if(vandor) {

            const files = req.files as [Express.Multer.File];

            const images = files.map((file: Express.Multer.File) => file.filename);

            const createdFood = await Food.create({
                vandorId: vandor._id,
                name,
                description,
                category,
                foodType,
                images: images,
                price,
                rating: 0
            })

            vandor.foods ? vandor.foods.push(createdFood._id) :  vandor.foods = [createdFood._id];
            const result = await vandor.save();

            return res.json(result);
        }

    }

    return res.json({ message: "Something went wrong" });
}

export const GetFoods = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if(user) {
        const foods = await Food.find({ vandorId: user._id });

        if(foods) {
            return res.json(foods); 
        }

    }

    return res.json({ message: "Foots not found" });
}