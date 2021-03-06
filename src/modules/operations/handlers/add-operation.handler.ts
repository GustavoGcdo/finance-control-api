import { ValidationFailedError } from '../../../infra/errors/validationFailedError';
import { Result } from '../../../infra/models/result';
import { IUserRepository } from '../../users/repositories/user-repository.interface';
import { AddOperationContract } from '../contracts/add-operation.contract';
import { AddOperationDto } from '../dtos/add-operation.dto';
import { Operation } from '../models/entities/operation';
import { UserOperation } from '../models/entities/user-operation';
import { OperationType } from '../models/enums/operation-type.enum';
import { IOperationRepository } from '../repositories/operation-repository.interface';
import { IAddOperationHandler } from './add-operation-handler.interface';

export class AddOperationHandler implements IAddOperationHandler {
    private _userRepository: IUserRepository;
    private _operationRepository: IOperationRepository;

    constructor(userRepository: IUserRepository,
      operationRepository: IOperationRepository) {
      this._userRepository = userRepository;
      this._operationRepository = operationRepository;
    }

    async handle(addOperationDto: AddOperationDto): Promise<Result<Operation>> {
      await this.validate(addOperationDto);
      const operationCreated = await this.addOperation(addOperationDto);
      const resultSucess = new Result(operationCreated, 'operation added successfully', true, []);
      return resultSucess;
    }

    private async validate(addOperationDto: AddOperationDto) {
      this.validateContract(addOperationDto);
    }

    private validateContract(addOperationDto: AddOperationDto) {
      const contract = new AddOperationContract(addOperationDto);
      const isInvalid = !contract.validate();

      if (isInvalid) {
        throw new ValidationFailedError('fail to add operation', ...contract.reports);
      }
    }

    async addOperation(addOperationDto: AddOperationDto) {
      const { userId, value, executed, type, date, ...rest } = addOperationDto;

      const userToAddOperation = await this.findUser(userId);
      const userOperation = userToAddOperation as UserOperation;
      const newValue = Number(value);

      const newOperation = {
        type,
        value: newValue,
        user: userOperation,
        date: date ? new Date(date) : null,
        executed: executed || false,
        ...rest
      } as Operation;

      const { balance } = userToAddOperation;
      let newBalance = balance || 0;

      if (executed && type === OperationType.EXPENSE) {
        newBalance -= newValue;
      }

      if (executed && type === OperationType.RECIPE) {
        newBalance += newValue;
      }

      const operationCreated = await this._operationRepository.add(newOperation);
      await this._userRepository.updateBalance(userId, newBalance);

      return operationCreated;
    }

    private async findUser(userId: string) {
      const userFound = await this._userRepository.getById(userId);

      if (!userFound) {
        throw new ValidationFailedError('fail to add operation', { name: 'user', message: 'non-existent user' });
      }

      return userFound;
    }
}
