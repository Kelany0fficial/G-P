using DAL.DataApp;
using DAL.Repo.Abstraction;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repo.Implementation
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        public async Task<List<T>> GetAllAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }
        protected readonly AppDbContext _context;
        internal DbSet<T> _dbSet;



        public GenericRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }



        public async Task<T> GetByIdAsync(Guid id)
        {
            return await _dbSet.FindAsync(id);
        }



        public async Task<T> GetByIdAsStringAsync(string id)
        {
            return await _dbSet.FindAsync(id);
        }



        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }



        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }



        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }



        public void Update(T entity)
        {
            _dbSet.Update(entity);
        }

        
        public async Task<IEnumerable<T>> FindAsyncInclude(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes)
        {
            // 1. نبدأ بـ Queryable من الـ DbSet
            IQueryable<T> query = _dbSet;

            // 2. لو بعت أسماء جداول (Includes)، بنضيفهم للـ Query واحد ورا التاني
            if (includes != null)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }

            // 3. نطبق الفلتر (Where) ونحول النتيجة لـ List
            return await query.Where(predicate).ToListAsync();
        }
        public void Delete(T entity)
        {
            _dbSet.Remove(entity);
        }

        public async Task<T> GetByIdWithIncludesAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _dbSet;

            if (includes != null)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }

            return await query.FirstOrDefaultAsync(predicate);
        }


        public async Task<T> GetByIdWithIncludesAsync(
    Expression<Func<T, bool>> predicate,
    Func<IQueryable<T>, IQueryable<T>> include)
        {
            IQueryable<T> query = _dbSet;

            query = include(query);

            return await query.FirstOrDefaultAsync(predicate);
        }





        public async Task<IEnumerable<T>> FindAsyncInclude(
    Expression<Func<T, bool>> predicate,
    Func<IQueryable<T>, IQueryable<T>> include)
        {
            IQueryable<T> query = _dbSet;

            query = include(query);

            return await query.Where(predicate).ToListAsync();
        }

        public async Task<IEnumerable<T>> GetAllAsyncInclude(
    Func<IQueryable<T>, IQueryable<T>> include)
        {
            IQueryable<T> query = _dbSet;

            query = include(query);

            return await query.ToListAsync();
        }


        public async Task<int> CountAsync(Expression<Func<T, bool>> predicate = null)
        {
            // لو مفيش شرط مبعوت، بيعد كل اللي في الجدول
            if (predicate == null)
            {
                return await _context.Set<T>().CountAsync();
            }

            // لو فيه شرط (زي إن المرشد يكون State == true)، بيعد بناءً على الشرط ده بس
            return await _context.Set<T>().CountAsync(predicate);
        }

    }
}
