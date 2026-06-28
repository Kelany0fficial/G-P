using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repo.Abstraction
{
    public interface IGenericRepository<T> where T : class
    {
        Task<List<T>> GetAllAsync(Expression<Func<T, bool>> predicate);
        Task<IEnumerable<T>> FindAsyncInclude(
    Expression<Func<T, bool>> predicate,
    Func<IQueryable<T>, IQueryable<T>> include);
         Task<IEnumerable<T>> GetAllAsyncInclude(
   Func<IQueryable<T>, IQueryable<T>> include);
        Task<T> GetByIdWithIncludesAsync(
    Expression<Func<T, bool>> predicate,
    Func<IQueryable<T>, IQueryable<T>> include);

        Task<T> GetByIdAsync(Guid id);
        Task<T> GetByIdWithIncludesAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);
        Task<IEnumerable<T>> FindAsyncInclude(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);
        Task<T> GetByIdAsStringAsync(string id); // عشان السائح والمرشد الـ ID بتاعهم String
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        void Update(T entity); // الـ Update والـ Delete مش محتاجين Task لأنهم بيغيروا State بس
        void Delete(T entity);
        Task<int> CountAsync(Expression<Func<T, bool>> predicate = null);
    }
}
