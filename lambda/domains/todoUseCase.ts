import {CognitoUserPool} from '../infrastructures/cognito';
import {DynamodbTodoTable} from '../infrastructures/dynamodbTodoTable';

/**
 * 特定のユーザのTodoについてユースケースを管理するクラス
 *
 * @export
 * @class TodoUseCase
 */
export class TodoUseCase{

    userId: string

    /**
     * TodoUseCaseのインスタンスを作成する
     * @param {string} token
     * @memberof TodoUseCase
     */
    constructor(token: string) {
        this.userId = CognitoUserPool.getUserNameFromIdToken(token)
    }    

    /**
     * 指定したIdのTodo情報を返却する
     *
     * @param {SpecifyTodoProps} specifyProps
     * @return {todo}  {Promise<Todo>}
     * @memberof TodoUseCase
     */
    public async getSpecificTodo(specifyProps: SpecifyTodoProps): Promise<Todo> {
        console.log(`指定したIdのTodo取得処理 開始 props: ${JSON.stringify(specifyProps)}`)
        const todoId = specifyProps.todoId
        const ddbReponse = await DynamodbTodoTable.getTodo({userId: this.userId, todoId: todoId})

        console.log(`Dynamodbからのレスポンス: ${JSON.stringify(ddbReponse)}`)

        let todo = {
            userId: '',
            todoId: '',
            title: '',
            content: '',
            dueDate:  '',
            isImportant: false
        }

        if (ddbReponse){
            if(ddbReponse.userId){todo.userId = ddbReponse.userId as string}
            if(ddbReponse.todoId){todo.todoId = ddbReponse.todoId as string}
            if(ddbReponse.title){todo.title = ddbReponse.title as string}
            if(ddbReponse.content){todo.content = ddbReponse.content as string}
            if(ddbReponse.dueDate){todo.dueDate = ddbReponse.dueDate as string}
            if(ddbReponse.dueDate){todo.isImportant = ddbReponse.dueDate as boolean}
        }else{
            
        }
        console.log(`指定したIdのTodo取得処理 終了 Retreved todo : ${JSON.stringify(todo)}`)

        return todo
    }

    // public async getAllTodo() {
        
    // }

    // public async findTodo() {
        
    // }

    // public async updateTodo(updateTodoProps: UpdateTodoProps) {
        
    // }

    // public async deleteTodo(specifyTodoProps:SpecifyTodoProps) {
        
    // }

    // public async createTodo(createTodoProps: CreateTodoProps) {
        
    // }

}

export interface Todo {
    userId: string;
    todoId: string;
    title: string;
    content: string;
    dueDate: string;
    isImportant: boolean;
}

// export interface CreateTodoProps {
//     title: string;
//     content: string;
//     dueDate?: Date;
//     isImportant?: boolean;
// }

// export interface UpdateTodoProps {
//     todoId: string;
//     title?: string;
//     content?: string;
//     dueDate?: Date;
//     isImportant?: boolean;
// }

export interface SpecifyTodoProps {
    todoId: string;
}
