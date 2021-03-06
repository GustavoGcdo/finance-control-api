import { ValidationFailedError } from '../../../infra/errors/validationFailedError';
import { Result } from '../../../infra/models/result';
import { PaginateOptions } from '../../shared/types/paginate-options';
import { IUserRepository } from '../../users/repositories/user-repository.interface';
import { GetUserOperationsContract } from '../contracts/get-user-operations.contract';
import { GetUserOperationsDto } from '../dtos/get-user-operations.dto';
import { PaginateOperationsDto } from '../dtos/pagintate-operations.dto';
import { IOperationRepository } from '../repositories/operation-repository.interface';
import { IGetUserOperationsHandler } from './get-user-operations-handler.interface';

export class GetUserOperationsHandler implements IGetUserOperationsHandler {
  private _operationRepository: IOperationRepository;
  private _userRepository: IUserRepository;

  constructor(
    operationRepository: IOperationRepository,
    userRepository: IUserRepository
  ) {
    this._operationRepository = operationRepository;
    this._userRepository = userRepository;
  }

  async handle(getUserOperationsDto: GetUserOperationsDto): Promise<Result<PaginateOperationsDto>> {
    this.validateContract(getUserOperationsDto);
    const paginateResult = await this.getOperations(getUserOperationsDto);
    const resultSuccess = new Result(paginateResult, 'success on fetch user operations', true, []);
    return resultSuccess;
  }

  private validateContract(getUserOperationsDto: GetUserOperationsDto) {
    const contract = new GetUserOperationsContract(getUserOperationsDto);
    const isInvalid = !contract.validate();

    if (isInvalid) {
      throw new ValidationFailedError('fail to get operations', ...contract.reports);
    }
  }

  private async getOperations(getUserOperationsDto: GetUserOperationsDto) {
    const { userId } = getUserOperationsDto;
    const userFound = await this.findUser(userId);
    const paginateOptions = this.getPaginateOptions(getUserOperationsDto);
    const resultPaginate = await this._operationRepository.paginate(userFound._id, paginateOptions);
    return resultPaginate;
  }

  private getPaginateOptions(getUserOperationsDto: GetUserOperationsDto): PaginateOptions {
    const { page = '1', limit = '10' } = getUserOperationsDto;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const paginateOptions: PaginateOptions = {
      limit: parseInt(limit),
      skip
    };

    return paginateOptions;
  }

  private async findUser(userId: string) {
    const userFound = await this._userRepository.getById(userId);

    if (!userFound) {
      throw new ValidationFailedError('fail to get operations', { name: 'user', message: 'non-existent user' });
    }

    return userFound;
  }
}
