import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsGitUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isGitUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          
          // SSH URL pattern: git@domain:user/repo.git
          const sshPattern = /^git@[\w\.\-]+:[\w\-\/]+\.git$/;
          
          // HTTPS URL pattern: https://domain/user/repo.git or without .git
          const httpsPattern = /^https?:\/\/[\w\.\-]+(:\d+)?\/[\w\-\/]+(\.git)?$/;
          
          return sshPattern.test(value) || httpsPattern.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Git URL (SSH or HTTPS format)`;
        },
      },
    });
  };
}