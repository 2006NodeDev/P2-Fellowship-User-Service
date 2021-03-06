//same test, but with loggers

const mockRequest = ()=>{
    return {
        user:undefined
    }
}

const mockResponse =() => {
    let res:any = {}
    res.status = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    return res
}


import { authenticationMiddleware } from './authentication-middleware'
import { logger } from '../utilities/loggers'

describe('authenticationMiddleware', ()=>{
    
    let req;
    let res;
    let next;

    //runs our setup before each individual test
    beforeEach(()=>{
        req = mockRequest()
        res = mockResponse()
        next = jest.fn()
    })

    it('Should not allow someone who is not logged in through', ()=>{
        //calls the middleware with a non existenent user
        authenticationMiddleware(req, res, next)
        expect(res.status).toBeCalledWith(401)
        expect(res.send).toBeCalledWith('Please Login')
        expect(next).not.toBeCalled()
    })

    it('Should allow through someone who is logged in', ()=>{
        req.user = {//set up the user object
            username:'Mithrandir',
            role:'Admin'
        }
        logger.debug = jest.fn()//mock console.log WITH LOGGER
        authenticationMiddleware(req,res,next)
        expect(res.status).not.toBeCalled()
        expect(res.send).not.toBeCalled()
        expect(next).toBeCalled()
        //expect(logger.debug).toBeCalledWith('user Mithrandir has a role of Admin')
        expect(logger.debug).toBeCalledWith('user Mithrandir has a role of Admin')

    })

})