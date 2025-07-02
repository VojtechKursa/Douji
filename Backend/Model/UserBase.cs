using Douji.Backend.Model.Interfaces;

namespace Douji.Backend.Model;

public abstract class UserBase(Room room, string name) : IValidatable
{
	public Room Room { get; } = room;
	public string Name { get; } = name;

	public virtual bool IsValid() => !string.IsNullOrEmpty(Name);
}
