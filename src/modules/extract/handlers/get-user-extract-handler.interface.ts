import { Result } from '../../../infra/models/result';
import { GetUserExtractDto } from '../dtos/get-user-extract.dto';
import { UserExtractDto } from '../dtos/user-extract.dto';

export interface IGetUserExtractHandler {
    handle(getUserExtractDto: GetUserExtractDto): Promise<Result<UserExtractDto>>;
}
